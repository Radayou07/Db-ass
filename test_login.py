import requests

url = "http://127.0.0.1:5001/api/auth/login"
data = {
    "email": "bora.dayou@gmail.com",
    "password": "admin123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
