# Circle Of Light

## Signup process

-   `credentials: "include"` is required
-   No verification is required yet
-   JWT token based authentication

#### request

```json
POST http://localhost:8000/api/v1/signup HTTP/1.1
Content-Type: application/json

{
	"first_name": "test",
	"last_name": "test",
	"phone_number": "0987654321",
	"email": "something@gmail.com",
	"password": "#78sfsfASff"
}
```

#### Response

```json
{
  "message": "Success",
  "code": 200,
  "status": "OK"
}
```

## Get User Data

#### request

```json
GET http://localhost:8000/api/v1/me HTTP/1.1
Content-Type: application/json
Cookie: _access=eyJhbGciOiJIUzI1NiIsInR5
```

#### Response
```json
{
  "code": "387356",
  "first_name": "test",
  "last_name": "test",
  "phone_number": "0987654321",
  "email": "something@gmail.com"
}
```

## Login process

#### request

```json
POST http://localhost:8000/api/v1/login HTTP/1.1
Content-Type: application/json

{
	"code": "387356"
}
```

#### Response

```json
{
  "message": "Success",
  "code": 200,
  "status": "OK"
}
```
