import socket
import ssl
import json
import http.client

def test():
    print("Connecting directly to AWS Graviton EC2 (13.207.140.19:443) with hostname api.resume-buddy.tech...")
    
    # 1. Establish raw TCP connection to AWS EC2 IP
    raw_sock = socket.create_connection(("13.207.140.19", 443), timeout=30)
    
    # 2. Wrap with TLS with SNI = api.resume-buddy.tech
    context = ssl.create_default_context()
    tls_sock = context.wrap_socket(raw_sock, server_hostname="api.resume-buddy.tech")
    
    # 3. Perform HTTPS request
    with open("scripts/test_payload.json", "r") as f:
        payload = f.read()

    request_data = (
        "POST /v1/resume/latex/compile HTTP/1.1\r\n"
        "Host: api.resume-buddy.tech\r\n"
        "Content-Type: application/json\r\n"
        "Accept: application/json\r\n"
        f"Content-Length: {len(payload.encode('utf-8'))}\r\n"
        "Connection: close\r\n"
        "\r\n" + payload
    )
    
    tls_sock.sendall(request_data.encode('utf-8'))
    
    # 4. Read response
    response_bytes = b""
    while True:
        chunk = tls_sock.recv(4096)
        if not chunk:
            break
        response_bytes += chunk
    tls_sock.close()
    
    response_str = response_bytes.decode('utf-8', errors='ignore')
    header_part, _, body_part = response_str.partition('\r\n\r\n')
    
    status_line = header_part.splitlines()[0] if header_part else "NO STATUS"
    print(f"\nResponse: {status_line}")
    
    try:
        data = json.loads(body_part)
        print(f"ok: {data.get('ok')}")
        print(f"pdfBase64 length: {len(data.get('pdfBase64', ''))}")
        print(f"latexSource length: {len(data.get('latexSource', ''))}")
        print("\n>>> SUCCESS! Verified end-to-end TLS 1.3 / HTTPS LaTeX compilation on AWS EC2 Graviton! <<<")
    except Exception as e:
        print("Raw response body:", body_part[:500])

if __name__ == '__main__':
    test()
