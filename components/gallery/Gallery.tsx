import React, { useState } from "react";
import styles from "./Gallery.module.css";
import Video from "../video/Video";
import { FaTwitter, FaLinkedin, FaGlobe, FaGithub } from "react-icons/fa";
import Modal from "react-modal";
import useBaseUrl from "@docusaurus/useBaseUrl";

Modal.setAppElement("#__docusaurus");

const categoryMapping = {
  misc: "miscellaneous",
  // Add more categories here if needed
};

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
        const categoryUrl = useBaseUrl(
          `/${categoryMapping[item.category] || item.category}`
        );

        const handleVideoClick = () => {
          if (item.category) {
            window.location.href = categoryUrl;
          } else {
            openModal(videoUrl);
          }
        };

        return (
          <div key={index} className={styles.card}>
            <div className={styles.videoContainer} onClick={handleVideoClick}>
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
                {item.githubId && (
                  <a
                    href={`https://github.com/${item.githubId}`}
                    target="_blank"
                    rel="noopener noreferrer">
                    <FaGithub className={styles.icon} />
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
              <div className={styles.sourceCategoryContainer}>
                {item.category && (
                  <span className={styles.category}>
                    {categoryMapping[item.category] || item.category}
                  </span>
                )}
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
