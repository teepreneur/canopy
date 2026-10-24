package dns

import (
	"fmt"
	"log/slog"
	"net"
	"sync"
	"time"

	"github.com/miekg/dns"
	"github.com/teepreneur/canopy/agent-go/internal/config"
)

const upstreamDNS = "8.8.8.8:53"

type BlockedCallback func(domain string)
type QueryCallback func(domain string)

type Blocker struct {
	rules      *config.Rules
	listenPort int
	blockedIP  string
	server     *dns.Server

	mu               sync.RWMutex
	onBlocked        []BlockedCallback
	onQuery          []QueryCallback
	recentBlocked    []blockedEntry
}

type blockedEntry struct {
	Time   time.Time
	Domain string
}

func NewBlocker(rules *config.Rules, port int) *Blocker {
	return &Blocker{
		rules:      rules,
		listenPort: port,
		blockedIP:  "0.0.0.0",
	}
}

func (b *Blocker) OnBlocked(cb BlockedCallback)   { b.onBlocked = append(b.onBlocked, cb) }
func (b *Blocker) OnQuery(cb QueryCallback)       { b.onQuery = append(b.onQuery, cb) }

func (b *Blocker) Start() error {
	mux := dns.NewServeMux()
	mux.HandleFunc(".", b.handleQuery)
	b.server = &dns.Server{
		Addr:    fmt.Sprintf("127.0.0.1:%d", b.listenPort),
		Net:     "udp",
		Handler: mux,
	}
	slog.Info("DNS blocker listening", "addr", b.server.Addr)
	go func() {
		if err := b.server.ListenAndServe(); err != nil {
			slog.Error("DNS server error", "err", err)
		}
	}()
	return nil
}

func (b *Blocker) Stop() {
	if b.server != nil {
		_ = b.server.Shutdown()
		slog.Info("DNS blocker stopped")
	}
}

func (b *Blocker) handleQuery(w dns.ResponseWriter, r *dns.Msg) {
	if len(r.Question) == 0 {
		return
	}
	qname := r.Question[0].Name
	domain := qname[:len(qname)-1] // strip trailing dot

	for _, cb := range b.onQuery {
		cb(domain)
	}

	if b.rules.IsDomainBlocked(domain) {
		slog.Info("BLOCKED", "domain", domain)
		b.mu.Lock()
		b.recentBlocked = append(b.recentBlocked, blockedEntry{time.Now(), domain})
		if len(b.recentBlocked) > 1000 {
			b.recentBlocked = b.recentBlocked[len(b.recentBlocked)-1000:]
		}
		b.mu.Unlock()

		for _, cb := range b.onBlocked {
			cb(domain)
		}

		msg := new(dns.Msg)
		msg.SetReply(r)
		if r.Question[0].Qtype == dns.TypeA {
			msg.Answer = append(msg.Answer, &dns.A{
				Hdr: dns.RR_Header{Name: qname, Rrtype: dns.TypeA, Class: dns.ClassINET, Ttl: 60},
				A:   net.ParseIP(b.blockedIP),
			})
		} else {
			msg.Rcode = dns.RcodeNameError
		}
		_ = w.WriteMsg(msg)
		return
	}

	resp, err := dns.Exchange(r, upstreamDNS)
	if err != nil {
		slog.Warn("Upstream DNS error", "err", err)
		msg := new(dns.Msg)
		msg.SetReply(r)
		msg.Rcode = dns.RcodeServerFailure
		_ = w.WriteMsg(msg)
		return
	}
	_ = w.WriteMsg(resp)
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}
