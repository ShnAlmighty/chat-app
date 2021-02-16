const socket = io();

//elements
const $messageForm = document.querySelector('#messageBox');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sideBar = document.querySelector('#sidebar');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#url-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search,{ ignoreQueryPrefix:true });

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    console.log(newMessageHeight);
    // Visible height
    const visibleHeight = $messages.offsetHeight;
    console.log(visibleHeight);
    // Height of messages container
    const containerHeight = $messages.scrollHeight;
    console.log(containerHeight);
    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;
    console.log(scrollOffset);
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message',(msg)=>{
    console.log(msg);
    const html = Mustache.render(messageTemplate,{
        username:msg.username,
        message:msg.text,
        createdAt:moment(msg.createdAt).format('h:mm:ss a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
});

socket.on('locationMessage',(location)=>{
    console.log(location);
    const html = Mustache.render(urlTemplate,{
        username:location.username,
        url:location.url,
        createdAt:moment(location.createdAt).format('h:mm:ss a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
});

socket.on('roomData',({ room,users })=>{
const html = Mustache.render(sidebarTemplate,{
    room,
    users
});
$sideBar.innerHTML=html;
});

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute('disabled','disabled');
    const msg = e.target.elements.text.value;
    socket.emit('messageSent', msg, (error)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value='';
        $messageFormInput.focus();

        if(error){
            return console.log(error);
        }
        console.log('Message delivered');
    });
});

$sendLocationButton.addEventListener('click',()=>{
    // document.querySelector('#send-location').disabled=true;
    $sendLocationButton.setAttribute('disabled','disabled');
    if(!navigator.geolocation){
        return alert('Gelocation API is not supported by your browser');
    }
    navigator.geolocation.getCurrentPosition((position)=>{
    socket.emit('sendLocation',{
        latitude:position.coords.latitude,
        longitude:position.coords.longitude
    },()=>{
        $sendLocationButton.removeAttribute('disabled');
        console.log('Location Sent');
    });
});
});

socket.emit('join',{ username, room }, (error)=>{
    if(error){
        alert(error);
        location.href='/';
    }
});