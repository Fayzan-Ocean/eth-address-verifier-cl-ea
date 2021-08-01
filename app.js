import express from "express";
import bodyParser from "body-parser";
import ea from "@chainlink/external-adapter";
import twitterApiV2 from "twitter-api-v2";

const Requester = ea.Requester;
const Validator = ea.Validator;
const TwitterApi = twitterApiV2.default;

const app = express();
const port = process.env.EA_PORT || 8080;

app.use(bodyParser.json());

const customParams = {
  tweetID: true,
  ethAddress: true,
  endpoint: false,
};

const createRequest = async (input, callback) => {
  // Instanciate with desired auth type (here's Bearer v2 auth)
  const twitterClient = new TwitterApi(process.env.BEARER_TOKEN);

  // Tell typescript it's a readonly app
  const roClient = twitterClient.readOnly;

  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams);
  const jobRunID = validator.validated.id;
  const tweetID = validator.validated.data.tweetID;
  const ethAddress = validator.validated.data.ethAddress;

  console.log("provided", tweetID, ethAddress, jobRunID);

  // "1421912738532495362"
  // "real "
  const response = await twitterClient.v2
    .singleTweet(tweetID, {
      expansions: ["author_id"],
      "user.fields": ["username"],
    })
    .catch((err) => {
      callback(500, Requester.errored(jobRunID, { error: String(err) }));
    });
  if (response == null) {
    callback(500, Requester.errored(jobRunID, { error: "null response" }));
  }
  if (response.errors == null) {
    console.log("response", response);
    if (response.data.text.includes(ethAddress)) {
      console.log("textcontains", "jobrunid", jobRunID);
      response.data = {
        username: response.includes.users[0].username,
        ethAddress: ethAddress,
        result: true,
      };
      response.status = 200;
      callback(response.status, Requester.success(jobRunID, response));
    } else {
      callback(
        500,
        Requester.errored(jobRunID, { error: "couldn't find eth address" }),
      );
    }
  } else {
    console.log("err", response.errors);
    callback(
      500,
      Requester.errored(jobRunID, { error: response.errors[0].detail }),
    );
  }
};

app.post("/", async (req, res) => {
  console.log("POST Data: ", req.body);
  await createRequest(req.body, (status, result) => {
    console.log("Result: ", result);
    res.status(status).json(result);
  });
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
