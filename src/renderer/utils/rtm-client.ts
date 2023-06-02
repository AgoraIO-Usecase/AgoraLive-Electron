import AgoraRTM, { RtmClient, RtmChannel, RtmEvents } from 'agora-rtm-sdk';
import { EventEmitter } from 'events';

class RTMClient extends EventEmitter {
  private client: RtmClient | null
  private channels: { [name: string]: { channel: RtmChannel, joined: boolean } }
  private accountName: string

  constructor() {
    super()
    this.channels = {}
    this.client = null
    this.accountName = ''
  }

  init(appId: string) {
    this.client = AgoraRTM.createInstance(appId);
    this.subscribeClientEvents();
  }

  // subscribe client events
  subscribeClientEvents() {
    const clientEvents: Array<keyof RtmEvents.RtmClientEvents> = [
      'ConnectionStateChanged',
      'MessageFromPeer'
    ];
    clientEvents.forEach((eventName) => {
      this.client?.on(eventName, (...args: any[]) => {
        console.log('emit ', eventName, ...args);
        // log event message
        this.emit(eventName, ...args);
      });
    });
  }

  // subscribe channel events
  subscribeChannelEvents(channelName: string) {
    const channelEvents: Array<keyof RtmEvents.RtmChannelEvents> = [
      'ChannelMessage',
      'MemberJoined',
      'MemberLeft'
    ];
    channelEvents.forEach((eventName) => {
      this.channels[channelName].channel.on(eventName, (...args: any[]) => {
        console.log('emit ', eventName, args);
        this.emit(eventName, { channelName, args: args });
      });
    });
  }

  async login (accountName, token) {
    this.accountName = accountName
    return this.client?.login({ uid: this.accountName, token })
  }

  async logout () {
    return this.client?.logout()
  }

  async joinChannel(name: string) {
    console.log('joinChannel', name);
    const channel = this.client?.createChannel(name);
    if (channel) {
      this.channels[name] = {
        channel,
        joined: false // channel state
      };
      this.subscribeChannelEvents(name);
      return channel.join();
    } else {
      throw new Error('Failed to create channel.');
    }
  }

  setJoinChannelState(channelName: string, status: boolean) {
    if (this.channels[channelName]) {
      this.channels[channelName].joined = status
    }
  }

  async leaveChannel(name: string) {
    console.log('leaveChannel', name);
    if (!this.channels[name] || (this.channels[name] && !this.channels[name].joined)) return;
    return this.channels[name].channel.leave();
  }

  async sendChannelMessage(text: string, channelName: string) {
    console.log('-----sendChannelMessage text: ',text)
    console.log('-----sendChannelMessage channelName: ',channelName)
    if (!this.channels[channelName] || !this.channels[channelName].joined){
      return
    } 
    console.log('channels[channelName].channel',this.channels[channelName])
    return this.channels[channelName].channel.sendMessage({ text })
  }

  async sendPeerMessage(text: string, peerId: string) {
    console.log('sendPeerMessage', text, peerId);
    return this.client?.sendMessageToPeer({ text }, peerId.toString());
  }

  async queryPeersOnlineStatus(memberId: string) {
    console.log('queryPeersOnlineStatus', memberId);
    return this.client?.queryPeersOnlineStatus([memberId]);
  }
}

export default RTMClient