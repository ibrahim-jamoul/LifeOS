import webpush from "web-push";

type PushConfiguration = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export function getPushConfiguration(): PushConfiguration | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

export function configureWebPush(): boolean {
  const configuration = getPushConfiguration();
  if (!configuration) return false;

  webpush.setVapidDetails(configuration.subject, configuration.publicKey, configuration.privateKey);
  return true;
}
