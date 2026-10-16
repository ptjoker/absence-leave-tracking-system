This is our primary branch for our library log system

## Admin request overview

`GET /api/admin/requests` is a read-only, admin-authorized aggregate of leave and
shift-swap requests. It accepts `q`, `status`, `type`, `from`, and `to` query
parameters and returns Student Assistant details, request dates, current
decision data, replacement responses, and approval history. Supporting leave
documents remain available through the authorized
`GET /api/requests/:id/document` endpoint.
