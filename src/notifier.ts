import * as PushNotifications from "@pusher/push-notifications-server";
import config from "./config";
let notificationClient = new PushNotifications({
  instanceId: config.notificationInstanceId,
  secretKey: config.notificationSecretKey,
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
