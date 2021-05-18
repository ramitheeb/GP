import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import { NotificationModule } from ".";
export const addNotification = async (notification: NotificationModule) => {
  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });
  db.run("INSERT INTO Notifications Values (?,?,?,?)", [
    null,
    notification.name,
    notification.body,
    notification.url,
  ]);
  db.close();
};
