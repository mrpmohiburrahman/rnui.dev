import data from "@/scripts/lastCommitDate.json"
import { format } from "timeago.js"

// A build-time JSON import: nothing was ever loading, and the `Loading last updated
// date...` placeholder only shifted the row a render in. The suppression sits on the
// <strong> because React applies it one level deep and that is the element owning the
// text that can differ — server and client either side of a timeago bucket boundary.
const LastUpdated: React.FC = () => (
  <p>
    Updated:{" "}
    <strong suppressHydrationWarning>
      {format(new Date(data.lastCommitDate))}
    </strong>
  </p>
)
export default LastUpdated
