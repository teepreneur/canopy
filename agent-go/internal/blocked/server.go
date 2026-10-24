package blocked

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strings"
)

const fallbackHTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Blocked by Canopy</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;justify-content:center;
align-items:center;min-height:100vh;margin:0;background:#F6F4EF;color:#2A3130}
.card{text-align:center;padding:3rem;border-radius:1rem;background:#fff;
box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:420px}
h1{color:#1B5E43;font-size:1.5rem}
.domain{color:#D4654A;font-weight:600;word-break:break-all}
</style></head><body>
<div class="card">
<h1>Blocked by Canopy</h1>
<p><span class="domain">{{DOMAIN}}</span> is not available right now.</p>
<p>A parent has restricted access to this site.</p>
</div></body></html>`

type Server struct {
	port     int
	server   *http.Server
}

func NewServer(port int) *Server {
	return &Server{port: port}
}

func (s *Server) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handle)
	s.server = &http.Server{
		Addr:    fmt.Sprintf("127.0.0.1:%d", s.port),
		Handler: mux,
	}

	ln, err := net.Listen("tcp", s.server.Addr)
	if err != nil {
		return err
	}
	slog.Info("Blocked page server started", "addr", s.server.Addr)
	go s.server.Serve(ln)
	return nil
}

func (s *Server) Stop() {
	if s.server != nil {
		_ = s.server.Shutdown(context.Background())
		slog.Info("Blocked page server stopped")
	}
}

func (s *Server) handle(w http.ResponseWriter, r *http.Request) {
	domain := r.Host
	if i := strings.Index(domain, ":"); i >= 0 {
		domain = domain[:i]
	}
	html := strings.ReplaceAll(fallbackHTML, "{{DOMAIN}}", domain)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, html)
}
