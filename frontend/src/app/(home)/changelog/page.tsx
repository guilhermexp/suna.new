import { Changelog } from "@/components/home/sections/changelog";

export const dynamic = 'force-dynamic';

export default function ChangelogPage() {
  return (
    <section id="changelog">
      <Changelog />
    </section>
  );
}