import React, { useEffect, useState } from "react";
import { format } from "timeago.js";

const LastUpdated: React.FC = () => {
  const [lastUpdatedMessage, setLastUpdatedMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchLastCommitDate = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/mrpmohiburrahman/awesome-react-native-ui/commits?per_page=1"
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const lastCommitDate = new Date(data[0].commit.committer.date);
          setLastUpdatedMessage(`Last updated: ${format(lastCommitDate)}`);
        }
      } catch (error) {
        console.error("Failed to fetch last commit date:", error);
      }
    };

    fetchLastCommitDate();
  }, []);

  return (
    <div>
      {lastUpdatedMessage ? (
        <p>{lastUpdatedMessage}</p>
      ) : (
        <p>Loading last updated date...</p>
      )}
    </div>
  );
};

export default LastUpdated;
