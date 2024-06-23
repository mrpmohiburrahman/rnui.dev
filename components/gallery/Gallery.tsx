// src/components/gallery/Gallery.js

import React, { useState } from "react";
import styles from "./Gallery.module.css";
import Video from "../video/Video";
import { FaTwitter, FaLinkedin, FaGlobe } from "react-icons/fa";
import Modal from "react-modal";
import useBaseUrl from "@docusaurus/useBaseUrl";

Modal.setAppElement("#__docusaurus");

const Gallery = ({ items }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");

  const openModal = (url) => {
    setCurrentVideoUrl(url);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentVideoUrl("");
  };

  return (
    <div className={styles.grid}>
      {items.map((item, index) => {
        const videoUrl = useBaseUrl(item.demo);
        return (
          <div key={index} className={styles.card}>
            <div
              className={styles.videoContainer}
              onClick={() => openModal(videoUrl)}>
              <Video title={item.Author} url={videoUrl} />
            </div>
            <div className={styles.cardContent}>
              {item.caption && <p className={styles.caption}>{item.caption}</p>}
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
        );
      })}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={styles.modal}
        overlayClassName={styles.overlay}>
        <div className={styles.modalContent}>
          <video
            src={currentVideoUrl}
            controls
            autoPlay
            loop
            className={styles.fullscreenVideo}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Gallery;
