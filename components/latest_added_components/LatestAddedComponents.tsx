// src/components/LatestAddedComponents.js

import React, { useState, useEffect } from "react";
import Gallery from "@site/components/gallery/Gallery";
import changedItems from "@site/data/changedItems.json";
import { FaChevronCircleRight, FaChevronCircleDown } from "react-icons/fa";

const LatestAddedComponents = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExpanded(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    changedItems.length > 0 && (
      <>
        <h2
          onClick={toggleExpand}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          {isExpanded ? <FaChevronCircleRight /> : <FaChevronCircleDown />}
          &nbsp;✨ Latest Added Components
        </h2>
        {isExpanded && (
          <div>
            <Gallery items={changedItems} />
          </div>
        )}
      </>
    )
  );
};

export default LatestAddedComponents;
