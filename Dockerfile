FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-download catalog at build time for faster cold starts
RUN python -c "
import urllib.request, json, os
url = 'https://tcp-us-prod-rnd.shl.com/voiceRater/shl-ai-hiring/shl_product_catalog.json'
try:
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read())
    os.makedirs('data', exist_ok=True)
    with open('data/catalog.json', 'w') as f:
        json.dump(data, f)
    print(f'Cached {len(data)} catalog items.')
except Exception as e:
    print(f'Catalog pre-cache failed: {e}')
" || true

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
