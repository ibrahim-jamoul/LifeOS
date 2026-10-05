import type { PushSubscription } from "web-push";
import { apiData, apiError, databaseError, isApiResponse, requireUser } from "@/lib/api";
import { configureWebPush } from "@/lib/push";

export const dynamic = "force-dynamic";

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function isExpiredSubscriptionError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "statusCode" in error
    && (error.statusCode === 404 || error.statusCode === 410);
}

export async function POST() {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  if (!configureWebPush()) {
    return apiError("PUSH_NOT_CONFIGURED", "Les notifications ne sont pas encore configurées sur le serveur.", 503);
  }

  const { data, error } = await auth.supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", auth.userId);
  if (error) return databaseError(error);

  const subscriptions = (data ?? []) as StoredSubscription[];
  if (subscriptions.length === 0) {
    return apiError("NO_SUBSCRIPTION", "Activez d’abord les notifications sur cet appareil.", 409);
  }

  const webpush = (await import("web-push")).default;
  const payload = JSON.stringify({
    title: "LifeOS est prêt",
    body: "Les notifications sont bien activées sur cet appareil.",
    url: "/app/settings/notifications",
    tag: "lifeos-test",
  });

  let sent = 0;
  await Promise.all(subscriptions.map(async (subscription) => {
    const target: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    };
    try {
      await webpush.sendNotification(target, payload, { TTL: 60 });
      sent += 1;
    } catch (pushError) {
      if (isExpiredSubscriptionError(pushError)) {
        const { error: deleteError } = await auth.supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id)
          .eq("user_id", auth.userId);
        if (deleteError) console.error("LifeOS push subscription cleanup failed", { code: deleteError.code });
        return;
      }
      console.error("LifeOS push test failed", { reason: pushError instanceof Error ? pushError.message : "UNKNOWN" });
    }
  }));

  if (sent === 0) return apiError("PUSH_DELIVERY_FAILED", "Le test n’a pas pu être délivré. Réactivez les notifications puis réessayez.", 502);
  return apiData({ sent });
}
