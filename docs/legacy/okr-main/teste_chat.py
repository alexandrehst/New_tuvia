import requests

user_id = input("Please enter your user ID: ")


url = f"http://127.0.0.1:5000/message"

payload = {}
headers = {
  'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21fa2V5IjoiVFVQVklBLmFpIiwib3RoZXJfa2V5IjoiS2V5MDI4In0.RuKt2_X26RQKjRLKAS0EpM3FwE3qrjh3K5u4tZXpwmQ'
}
while True:
    message = input("Please enter your message: ")
    if message == "exit":
        break

    payload = {
        'user_id': user_id,
        'message': message
    }
    response = requests.request("GET", url, headers=headers, params=payload)

    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()
        print(data['message'])
    else:
        print(f"Request failed with status code {response.status_code}")


