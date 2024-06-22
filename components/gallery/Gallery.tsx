// src/components/Gallery.js

import React from "react";
import styles from "./Gallery.module.css";
import { Video } from "@site/components/video";
import useBaseUrl from "@docusaurus/useBaseUrl";
const Gallery = ({ items }) => {
  console.log(`🚀 ~ Gallery ~ items:`, items);
  return (
    <div className={styles.grid}>
      {items.map((item, index) => (
        <div key={index} className={styles.gridItem}>
          <Video
            title="React Native Bottom Sheet"
            url={useBaseUrl(item.demo)}
          />
          <p>{item.Author}</p>
        </div>
      ))}
    </div>
  );
};

export default Gallery;
