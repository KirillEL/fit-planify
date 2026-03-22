FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o planify-api ./cmd

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/planify-api .
COPY --from=builder /app/migrations ./migrations
EXPOSE 8080
CMD ["./planify-api"]
