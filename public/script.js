const socket = new WebSocket("ws://localhost:9061");
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host: '/',
    port: '9062'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = new Peer({
    config: {
        iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN server in production
        ]
    }
})
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    /*socket.addEventListener('user-connected', userId => {
        connectToNewUser(userId, stream)
    })*/
    socket.addEventListener('message', (event) => {
        const { event: eventName, id } = JSON.parse(event.data);
        if (eventName === 'user-connected') {
            connectToNewUser(id, stream);
        }
    });
}).catch(err => {
    console.error('Cannot access device camera or microphone:', err.message)
})

/*socket.addEventListener('user-disconnected', userId => {
    //console.log(userId)
    if (peers[userId]) {
        peers[userId].close()
    }
})*/
socket.addEventListener('message', (event) => {
    const { event: eventName, id } = JSON.parse(event.data);
    if (eventName === 'user-disconnected') {
        if (peers[userId]) {
            peers[userId].close()
        }
    }
});

myPeer.on('open', id => {
    //socket.emit('join-room', ROOM_ID, id)
    //socket.send(JSON.stringify({ type: 'join-room', data: ROOM_ID, id }) );
    socket.send(JSON.stringify({
      event: 'join-room',
      //data: [ROOM_ID, id]
      roomId: ROOM_ID,
      userId: id
    }));
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

/*socket.on('user-connected', userId => {
    console.log('User connected: ' + userId)
})*/

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}
