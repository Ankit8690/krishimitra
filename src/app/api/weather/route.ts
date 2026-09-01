import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { getWeather } from "@/lib/weather";
import { geocode } from "@/lib/geocode";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  let lat = url.searchParams.get("lat") ? Number(url.searchParams.get("lat")) : null;
  let lon = url.searchParams.get("lon") ? Number(url.searchParams.get("lon")) : null;

  if (lat == null || lon == null) {
    await dbConnect();
    const user = await User.findById(session.sub).exec();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.location?.lat && user.location?.lon) {
      lat = user.location.lat;
      lon = user.location.lon;
    } else if (user.location?.district && user.location?.state) {
      const geo = await geocode(user.location.district, user.location.state);
      if (!geo)
        return NextResponse.json(
          { error: "Could not locate your farm" },
          { status: 400 }
        );
      lat = geo.lat;
      lon = geo.lon;
      user.location.lat = lat;
      user.location.lon = lon;
      await user.save();
    } else {
      return NextResponse.json(
        { error: "Set your farm location in profile" },
        { status: 400 }
      );
    }
  }

  try {
    const report = await getWeather(lat, lon);
    return NextResponse.json({ report });
  } catch (err) {
    console.error("[weather] error", err);
    return NextResponse.json({ error: "Weather service failed" }, { status: 502 });
  }
}
