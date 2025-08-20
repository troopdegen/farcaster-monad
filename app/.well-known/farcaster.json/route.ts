import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add your own account association
    // example association for workshops:
    accountAssociation: {
      header:
        "eyJmaWQiOjEwNjg1LCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4ODI1Nzk0ZjM3OTJlODE5NTFGRTU1QjdGNTI3ZWFiN2U4MDYzZDJjYyJ9",
      payload: "eyJkb21haW4iOiJmYXJjYXN0ZXItbW9uYWQudmVyY2VsLmFwcCJ9",
      signature:
        "/RNouvX/hJ55JqDX6ZyEgX/WIncamhQzWWVCbpWs16xdxsFIUuQMD0yX7xRjUhNXms5usWa1ghevrYyvkQYstBw=",
    },
    frame: {
      version: "1",
      name: "Monad Farcaster MiniApp Template",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "template"],
      primaryCategory: "developer-tools",
      buttonTitle: "Launch Template",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
