import { useEffect, useState } from 'react';
import { query, arweave, createVideoMeta } from '../utils';
import { css } from '@emotion/css';

// basic exponential backoff in case of gateway timeout / error
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

export default function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    getVideos();
  }, [])

  async function getVideos(depth = 0) {
    try {
      const results = await arweave.api.post('/graphql', query)
        .catch(err => {
          console.error('GraphQL query failed')
          throw new Error(err);
        });
      const edges = results.data.data.transactions.edges;
      const videos = await Promise.all(
        edges.map(async edge => await createVideoMeta(edge.node))
      );
      let sorted = videos.sort((a, b) => new Date(b.request.data.createdAt) - new Date(a.request.data.createdAt));
      sorted = sorted.map(s => s.request.data);
      setVideos(sorted);
    } catch (err) {
      await wait(2 ** depth * 10);
      console.log('error: ', err);
    }
  }

  return (
    <div className={containerStyle}>
      {
        videos.map(video => (
          <div className={videoContainerStyle} key={video.URI}>
            <video key={video.URI} width="720px" height="405" controls className={videoStyle}>
              <source src={video.URI} type="video/mp4"/>
            </video>
            <div className={titleContainerStyle}>
              <h3 className={titleStyle}>{video.title}</h3>
            </div>
            <p className={descriptionStyle}>{video.description}</p>
          </div>
        ))
      }
    </div>
  );
}

const videoStyle = css`
  background-color: rgba(0, 0, 0, .05);
  box-shadow: rgba(0, 0, 0, 0.15) 0px 5px 15px 0px;
  `;

const containerStyle = css`
  width: 720px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const titleContainerStyle = css`
  display: flex;
  justify-content: flex-start;
  margin: 19px 0px 8px;
`;

const videoContainerStyle = css`
  display: flex;
  flex-direction: column;
  margin: 20px 0px 40px;
`;

const titleStyle = css`
  margin:  0;
  font-size: 30px;
`;

const descriptionStyle = css`
  margin: 0;
`;