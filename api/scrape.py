from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
from serpapi import GoogleSearch

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8'))
            api_key = body.get('apiKey')
            keyword = body.get('keyword')
            city = body.get('city')
            
            if not api_key or not keyword or not city:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*') 
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing required fields"}).encode('utf-8'))
                return

            params = {
                "engine": "google_maps",
                "q": f"{keyword} di {city}",
                "type": "search",
                "api_key": api_key
            }

            search = GoogleSearch(params)
            results = search.get_dict()
            places = results.get("local_results", [])
            
            data = []
            for place in places:
                data.append({
                    "name": place.get("title"),
                    "address": place.get("address"),
                    "phone": place.get("phone"),
                    "website": place.get("website"),
                    "rating": place.get("rating")
                })

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
         self.send_response(405)
         self.send_header('Content-type', 'text/plain')
         self.end_headers()
         self.wfile.write("Method Not Allowed".encode('utf-8'))

# Local development server
if __name__ == '__main__':
    from http.server import HTTPServer
    server = HTTPServer(('localhost', 5328), handler)
    print("Starting local Python server at http://localhost:5328")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
