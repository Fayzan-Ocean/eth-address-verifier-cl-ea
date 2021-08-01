# eth-address-verifier-cl-ea

Chainlink External Adapter to verify Ethereum Address

## Getting Started

This EA checks tweets containing an eth address.

- Set environment variable `BEARER_TOKEN` (use Twitter developer API v2)

### Input Params

- `tweetID`: The public tweet id.
- `ethAddress`: The eth address that needs to be verified.

### Sample Request

```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": {"tweetID":"1419564161789485077","ethAddress":"0x20573BaB17Db36d53990b81031fCc202E199EF36"}}'
```

### Sample Response

```json
{
  "jobRunID": 0,
  "data": {
    "username": "EthFrenchy",
    "ethAddress": "0x20573BaB17Db36d53990b81031fCc202E199EF36",
    "result": true
  },
  "result": true,
  "statusCode": 200
}
```
