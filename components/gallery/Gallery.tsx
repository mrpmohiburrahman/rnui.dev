// src/components/gallery/Gallery.js

import React from "react";
import styles from "./Gallery.module.css";
import Video from "../video/Video";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { FaTwitter, FaLinkedin, FaGlobe } from "react-icons/fa";

const Gallery = ({ items }) => {
  return (
    <div className={styles.grid}>
      {items.map((item, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.videoContainer}>
            <Video title={item.Author} url={useBaseUrl(item.demo)} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.author}>{item.Author}</h3>
            <div className={styles.icons}>
              {item.twitterId && (
                <a
                  href={`https://twitter.com/${item.twitterId}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <FaTwitter className={styles.icon} />
                </a>
              )}
              {item.linkedInId && (
                <a
                  href={`https://linkedin.com/in/${item.linkedInId}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <FaLinkedin className={styles.icon} />
                </a>
              )}
              {item.personalSite && (
                <a
                  href={item.personalSite}
                  target="_blank"
                  rel="noopener noreferrer">
                  <FaGlobe className={styles.icon} />
                </a>
              )}
            </div>
            <div className={styles.source}>
              <a
                href={item.source}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceButton}>
                Get Source
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Gallery;
