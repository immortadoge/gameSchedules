interface BroadcastsProps {
  channels: readonly string[];
}

/** The `Image(systemName: "tv")` + channel list line from the iOS rows. */
export function Broadcasts({ channels }: BroadcastsProps) {
  if (channels.length === 0) return null;
  return (
    <p className="broadcasts">
      <span aria-hidden="true">📺</span>
      <span className="visually-hidden">Broadcast on </span>
      {channels.join(', ')}
    </p>
  );
}
