import React, { useEffect, useState } from "react";
import { format } from "timeago.js";
import data from "../../scripts/lastCommitDate.json";
const LastUpdated: React.FC = () => {
  const [lastUpdatedMessage, setLastUpdatedMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchLastCommitDate = async () => {
      try {
        if (data && data.lastCommitDate) {
          const lastCommitDate = new Date(data.lastCommitDate);
          const formattedDate = format(lastCommitDate);
          setLastUpdatedMessage(`Last updated: ${formattedDate}`);
        }
      } catch (error) {
        console.error("Failed to fetch last commit date:", error);
      }
    };

    fetchLastCommitDate();
  }, []);

  const renderLastUpdatedMessage = (message: string) => {
    const parts = message.split("Last updated: ");
    if (parts.length > 1) {
      return (
        <p>
          Last updated: <strong>{parts[1]}</strong>
        </p>
      );
    }
    return <p>{message}</p>;
  };

  return (
    <div>
      {lastUpdatedMessage ? (
        renderLastUpdatedMessage(lastUpdatedMessage)
      ) : (
        <p>Loading last updated date...</p>
      )}
    </div>
  );
};

export default LastUpdated;
