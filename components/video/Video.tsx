// src/components/video/Video.js

import React from "react";
import styles from "./Video.module.css";

const Video = ({ title, url }) => {
  return (
    <video
      muted={true}
      loop={true}
      autoPlay={true}
      controls={false}
      playsInline={true}
      title={title}
      className={styles.video}>
      <source src={url} type="video/mp4" />
    </video>
  );
};

export default Video;
