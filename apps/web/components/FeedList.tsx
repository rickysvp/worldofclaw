import type { WorldFeedEvent } from "../lib/types";
import { EmptyState } from "./EmptyState";
import { FeedItem } from "./FeedItem";

type FeedListProps = {
  events: WorldFeedEvent[];
};

export function FeedList(props: FeedListProps) {
  if (props.events.length === 0) {
    return <EmptyState title="当前筛选下没有事件" description="换一个筛选条件，或者等待下一次世界同步。" />;
  }

  return (
    <div className="space-y-3">
      {props.events.map((event) => (
        <FeedItem key={event.id} event={event} />
      ))}
    </div>
  );
}
