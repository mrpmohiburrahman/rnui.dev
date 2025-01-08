import { useEffect, useState } from "react"
import data from "@/scripts/lastCommitDate.json"
import { format } from "timeago.js"

const LastUpdated: React.FC = () => {
  const [lastUpdatedMessage, setLastUpdatedMessage] = useState<string | null>(
    null
  )

  useEffect(() => {
    const fetchLastCommitDate = async () => {
      try {
        if (data?.lastCommitDate) {
          const lastCommitDate = new Date(data.lastCommitDate)
          const formattedDate = format(lastCommitDate)
          setLastUpdatedMessage(formattedDate)
        }
      } catch (error) {
        console.error("Failed to fetch last commit date:", error)
      }
    }

    fetchLastCommitDate()
  }, [])

  const renderLastUpdatedMessage = (message: string) => {
    if (message) {
      return (
        <p>
          Updated: <strong>{message}</strong>
        </p>
      )
    }
    return <p>{message}</p>
  }

  return (
    <div>
      {lastUpdatedMessage ? (
        renderLastUpdatedMessage(lastUpdatedMessage)
      ) : (
        <p>Loading last updated date...</p>
      )}
    </div>
  )
}

export default LastUpdated
