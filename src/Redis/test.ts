import { RedisPubSub } from "graphql-redis-subscriptions";
import * as Redis from "ioredis";

const client = new Redis();
const demo = async () => {
  const x = await client.send_command("PUBSUB", ["channels"]);
  console.log(x);
};

client
  .multi()
  .get("numOfSubs")
  .incr("numOfSubs")
  .exec((err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(result);
  });
