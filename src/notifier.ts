import * as PushNotifications from "@pusher/push-notifications-server";
import {
  getNotificationAPIKey,
  getNotificationDomain,
  getNotificationInstanceID,
} from "./Configuration";

let notificationClient = new PushNotifications({
  instanceId: getNotificationInstanceID(),
  secretKey: getNotificationAPIKey(),
});
const BaseBody: PushNotifications.WebNotificationPayload = {
  title: "Server Monitor",
  body: "Notification",
  deep_link: getNotificationDomain(),
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
