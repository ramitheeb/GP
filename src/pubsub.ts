import { RedisPubSub } from "graphql-redis-subscriptions";
import * as Redis from "ioredis";

export const generalRedisClient = new Redis();

const subscriberRedisClient = new Redis();
const publisherRedisClient = new Redis();

export const pubsub = new RedisPubSub({
  publisher: publisherRedisClient,
  subscriber: subscriberRedisClient,
});
