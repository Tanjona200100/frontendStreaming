import React, { useEffect, useState, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://192.168.2.161:5000/ws';

const VRStreamViewer = () => {
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const peerRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(`${WEBSOCKET_URL}?type=viewer&deviceId=react-${Date.now()}`);

    ws.onopen = () => {
      console.log('✅ Connecté au serveur WebSocket');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'request-streams' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'streams-list':
        case 'streams-updated':
          setStreams(data.streams);
          break;

        case 'stream-offer':
          handleStreamOffer(data);
          break;

        case 'ice-candidate':
          handleICECandidate(data);
          break;

        case 'stream-ended':
          if (selectedStream?.id === data.streamId) {
            setSelectedStream(null);
            alert('Le stream a été terminé');
          }
          break;

        default:
          console.warn('Type de message WebSocket inattendu:', data.type);
          break;
      }
    };

    ws.onclose = () => {
      console.log('🔌 Déconnecté du serveur');
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [selectedStream]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [connectWebSocket]);

  const handleStreamOffer = async (data) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      if (signal.type === 'answer') {
        wsRef.current.send(JSON.stringify({
          type: 'stream-answer',
          streamId: data.streamId,
          sdp: signal
        }));
      } else if (signal.type === 'candidate') {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          streamId: data.streamId,
          candidate: signal.candidate
        }));
      }
    });

    peer.on('stream', (remoteStream) => {
      if (videoRef.current) videoRef.current.srcObject = remoteStream;
    });

    peer.on('error', (err) => console.error('Peer error:', err));

    peer.signal(data.sdp);
    peerRef.current = peer;
  };

  const handleICECandidate = (data) => {
    if (peerRef.current) peerRef.current.signal(data.candidate);
  };

  const joinStream = (streamId) => {
    wsRef.current.send(JSON.stringify({ type: 'join-stream', streamId }));
    setSelectedStream(streams.find(s => s.id === streamId));
  };

  return (
    <div className="container">
      <h1>Streaming VR</h1>
      <div className="status">
        <span className={`dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
        {isConnected ? 'Connecté' : 'Déconnecté'}
      </div>

      {!selectedStream ? (
        <div className="streams-list">
          <h2>Streams Disponibles ({streams.length})</h2>
          {streams.length === 0 ? (
            <p>Aucun stream disponible</p>
          ) : (
            <div className="streams-grid">
              {streams.map(stream => (
                <div key={stream.id} className="stream-card">
                  <h3>{stream.title}</h3>
                  <p>{stream.description}</p>
                  <p>👁️ {stream.viewers} viewers</p>
                  <button onClick={() => joinStream(stream.id)}>Rejoindre</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="stream-viewer">
          <h2>{selectedStream.title}</h2>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            style={{ width: '100%', maxWidth: '800px' }}
          />
          <button onClick={() => setSelectedStream(null)}>Retour à la liste</button>
        </div>
      )}
    </div>
  );
};

export default VRStreamViewer;
