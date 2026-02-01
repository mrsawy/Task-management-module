# Authenticating requests

To authenticate requests, include an **`Authorization`** header with the value **`"Bearer Bearer {YOUR_JWT_TOKEN}"`**.

All authenticated endpoints are marked with a `requires authentication` badge in the documentation below.

This API uses JWT (JSON Web Token) authentication. To authenticate, first login via `POST /api/auth/login` to get your token, then include it in the Authorization header as `Bearer {token}`.
