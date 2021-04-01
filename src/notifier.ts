import * as PushNotifications from "@pusher/push-notifications-server";
import config from "./config";
let notificationClient = new PushNotifications({
  instanceId: "6aab17a9-3a0a-471b-93b9-6d087c58d1fe",
  secretKey: "918DF36F5275AA6EDCE6F35362EA0740871A9393EF73D80B1741CC3935B2A4E8",
});

const BaseBody: PushNotifications.WebNotificationPayload = {
  title: "Server Monitor",
  body: "Notification",
  deep_link: config.domain,
  icon: "https://www.fillmurray.com/640/360",
};

export const NotifyAll = (
  payload: PushNotifications.WebNotificationPayload = {}
) => {
  notificationClient.publishToInterests(["monitor"], {
    web: {
      notification: {
        ...BaseBody,
        ...payload,
      },
    },
  });
};

NotifyAll();
