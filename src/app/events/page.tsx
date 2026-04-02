import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { EVENTS, getEventStatus, daysUntil, type CyberEvent } from "@/lib/events-data";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Radio,
  Clock,
  Star,
  GraduationCap,
  Swords,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cybersecurity Events & Conferences",
  description: "Upcoming cybersecurity conferences, summits, trainings, and CTF competitions — Black Hat, DEF CON, RSA, Pwn2Own, and more.",
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  conference: { label: "Conference", icon: Users, color: "text-primary" },
  training: { label: "Training", icon: GraduationCap, color: "text-threat-medium" },
  ctf: { label: "Competition", icon: Swords, color: "text-threat-high" },
  summit: { label: "Summit", icon: Star, color: "text-primary" },
};

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${s.getFullYear()}`;
}

function EventCard({ event }: { event: CyberEvent }) {
  const status = getEventStatus(event);
  const days = daysUntil(event.startDate);
  const typeConfig = TYPE_CONFIG[event.type];
  const TypeIcon = typeConfig.icon;

  return (
    <a href={event.website} target="_blank" rel="noopener noreferrer">
      <Card className={cn(
        "group h-full transition-all hover:shadow-md",
        status === "live" && "border-primary/40 bg-primary/5",
        event.featured && status !== "live" && "border-primary/20",
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {status === "live" && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] gap-1 animate-threat-pulse">
                    <Radio className="h-2.5 w-2.5" /> LIVE NOW
                  </Badge>
                )}
                {status === "upcoming" && days <= 30 && (
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                    {days === 0 ? "Starts today" : days === 1 ? "Tomorrow" : `${days} days`}
                  </Badge>
                )}
                <Badge variant="outline" className={cn("text-[10px] gap-1", typeConfig.color)}>
                  <TypeIcon className="h-2.5 w-2.5" />
                  {typeConfig.label}
                </Badge>
              </div>
              <h3 className="text-base font-bold group-hover:text-primary transition-colors">
                {event.name}
              </h3>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {event.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateRange(event.startDate, event.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[9px]">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

export default function EventsPage() {
  const now = new Date();

  const liveEvents = EVENTS.filter((e) => getEventStatus(e) === "live");
  const upcomingEvents = EVENTS
    .filter((e) => getEventStatus(e) === "upcoming")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const pastEvents = EVENTS
    .filter((e) => getEventStatus(e) === "past")
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const nextEvent = upcomingEvents[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Cybersecurity Events</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Conferences, summits, trainings, and CTF competitions for security professionals.
      </p>

      {/* Next Up Banner */}
      {nextEvent && (
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-card to-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Next event</div>
                <div className="text-sm font-semibold">{nextEvent.name}</div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {daysUntil(nextEvent.startDate)} days away
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDateRange(nextEvent.startDate, nextEvent.endDate)} · {nextEvent.city}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-4 w-4 text-primary animate-threat-pulse" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Happening Now
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {liveEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">
          Upcoming ({upcomingEvents.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* Past */}
      {pastEvents.length > 0 && (
        <>
          <Separator className="my-6" />
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-muted-foreground">
              Past Events ({pastEvents.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 opacity-60">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
