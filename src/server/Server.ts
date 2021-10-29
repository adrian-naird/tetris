import * as express from 'express';
import * as serveStatic from 'serve-static';
import * as ws from 'ws';
import {
    ClientMessage, ServerMessageCodeAssignment,
    ServerMessageJoiningFriend, ServerMessage,
    ServerMessageNotification,
    ServerMessageFriendJoins,
    ServerMessageGone,
    ServerMessagePlayerWon,
}
    from '../Messages';
import { ServerField } from '../client/Tetris/ServerTetris/ServerField';

export type ClientData = {
    socket: ws,
    id: number,
    name: string,
    host: boolean,
    code: number,
    field?: ServerField
}

export type NameIDData = {
    id: number,
    name: string
}

type round = {
    code: number,
    memberList: ClientData[],
    inMatch: boolean
}
export class MainServer {

    expressApp: express.Express = express();
    wsServer: ws.Server;

    clients: ClientData[] = [];
    temp4PlayerList: ClientData[];
    // tempCode: number;
    rounds: round[] = [];

    // codeToMemberListMap: Map<number, ClientData[]> = new Map();
    // clientDataToCodeMap: Map<ClientData, number> = new Map();
    socketToClientDataMap: Map<ws, ClientData> = new Map();
    // codes: number[] = [];
    // clientDataToFieldMap: Map<ClientData, ServerField> = new Map();

    constructor() {
        this.expressApp.use(serveStatic('./htdocs/'));
        const server = this.expressApp.listen(5600);
        console.log("Server gestartet: http://localhost:5600/");

        this.wsServer = new ws.Server({ noServer: true });


        /* 
            Wenn ein Client eine Websocket-Connection eröffnet, sendet er dem MainServer über http eine Upgrade Request.
            Der MainServer leitet die Request dann dem Websocket Server weiter, der diese TCP Connection dann zu einem Websocket macht:
        */
        let that = this;
        server.on('upgrade', (request, socket, head) => {
            that.wsServer.handleUpgrade(request, socket, head, socket => {
                that.wsServer.emit('connection', socket, request);
            });
        });


        // Verdrahten der WebSocket-Ereignishandler
        that.wsServer.on('connection', (socketClient: ws) => {

            socketClient.on('message', (message: ws.Data) => {
                that.onWebSocketClientMessage(socketClient, message);
            })

            socketClient.on('close', () => {
                that.onWebSocketClientClosed(socketClient);
            })
        })
    }

    nameIDDatafy(clientData: ClientData): NameIDData {
        return {
            id: clientData.id,
            name: clientData.name
        }
    }

    /**
     * Schickt die Nachricht den Mitspielern eines Spielers
     * @param ignoredClientSocket der (ignorierte) Spieler
     * @param message Nachricht, die die Mitspieler erhalten sollen
     */
    sendToMembers(message: ServerMessage, clientData: ClientData) {
        for (let client of this.getRound(clientData.code).memberList) {
            if (client.socket != clientData.socket) {
                client.socket.send(JSON.stringify(message));
            }
        }
    }

    getRound(code: number) {
        let round: round;
        this.rounds.some(e => { round = e; e.code == code })
        return round;
    }

    /**
     * Beantwortung aller Nachrichten des Clients an den Server.
     * @param messagerSocket Websocket des Adressanten der Message
     * @param messageJson die Nachricht 
     */
    onWebSocketClientMessage(messagerSocket: ws, messageJson: ws.Data) {

        let message: ClientMessage = JSON.parse(<string>messageJson);

        switch (message.type) {
            case "newClient":
                //Erstelle dem neuen Client eine ClientData, und setz in richtig ins System ein. Code generieren, einsetzen in die Maps, usw.
                let newClientCode = this.generateCode();
                let newClientData: ClientData = {
                    socket: messagerSocket,
                    id: this.clients.length + 1,
                    name: message.name,
                    host: true,
                    code: newClientCode
                };

                this.clients.push(newClientData);
                this.socketToClientDataMap.set(messagerSocket, newClientData);
                let ownMatch: ClientData[] = [newClientData];
                this.rounds.push({ code: newClientCode, memberList: ownMatch, inMatch: false });
                let sca: ServerMessageCodeAssignment = {
                    type: "codeAssignment",
                    ownData: this.nameIDDatafy(newClientData),
                    code: newClientCode
                }

                messagerSocket.send(JSON.stringify(sca))

                break;
            case "joinFriend":
                //Sag dem Freund, dass er joint. Sag ihm die Namen seiner neuen Mitspieler.
                let JoinerData: ClientData = this.socketToClientDataMap.get(messagerSocket);
                let newCode: number = message.newCode;
                let joiningRound: round = this.getRound(newCode);
                console.log(joiningRound);
                if (!this.rounds.some(e => e.code == newCode)) {
                    let sce: ServerMessageNotification = {
                        type: "codeError"
                    }
                    messagerSocket.send(JSON.stringify(sce));
                } else if (joiningRound.inMatch) {
                    let sce: ServerMessageNotification = {
                        type: "gameRunning"
                    }
                    messagerSocket.send(JSON.stringify(sce));
                } else {
                    let newMemberList: ClientData[] = joiningRound.memberList;
                    if (newMemberList.length < 5) {
                        JoinerData.host = false;

                        let sfj: ServerMessageFriendJoins = {
                            type: "friendJoins",
                            player: this.nameIDDatafy(JoinerData)
                        };


                        let sjf: ServerMessageJoiningFriend = {
                            type: "joiningFriend",
                            newPlayers: newMemberList,
                            code: newCode
                        };

                        messagerSocket.send(JSON.stringify(sjf));
                        this.socketToClientDataMap.get(messagerSocket).host = false;
                        newMemberList.push(JoinerData);
                        joiningRound.memberList = newMemberList
                        JoinerData.code = newCode;
                        this.sendToMembers(sfj, this.socketToClientDataMap.get(messagerSocket));

                    } else {
                        let ssf: ServerMessageNotification = {
                            type: "serverFull"
                        }
                        messagerSocket.send(JSON.stringify(ssf));
                    }
                }
                break;

            case "startGame":
                let starterData: ClientData = this.socketToClientDataMap.get(messagerSocket);
                let startedCode: number = starterData.code
                let startedRound: round = this.getRound(startedCode)
                let memberList: ClientData[] = startedRound.memberList;
                // joiningRound.inMatch = true;
                let fields: ServerField[];
                memberList.forEach(e => e.field = new ServerField(e, this));
                let shs: ServerMessageNotification = {
                    type: "hostStartsTheGame",
                };
                this.sendToMembers(shs, this.socketToClientDataMap.get(messagerSocket));
                break;
            case "keyPressed":
                let field = this.socketToClientDataMap.get(messagerSocket).field;
                let brick = field.brick;
                if (brick != null) {
                    switch (message.key) {
                        case "R":
                            brick.rKeypushed();
                            break;
                        case "Ld":
                            brick.left = true;
                            break;
                        case "Lu":
                            brick.left = false;
                            break;
                        case "Rd":
                            brick.right = true;
                            break;
                        case "Ru":
                            brick.right = false;
                            break;
                        case "Dd":
                            brick.down = true;
                            break;
                        case "Du":
                            brick.down = false;
                            break;
                        case "H":
                            field.changeHoldBrick();
                            break;
                    }
                }
                break;
            case "lineDrag":
                this.socketToClientDataMap.get(messagerSocket).field.remove = true;
                break;
            case "sendLine":
                let id = message.player.id;
                this.clients.forEach(e => {

                    if (e.id == id) {
                        e.field.lineSent();
                    }
                })
                break;
        }
    }

    checkIfWon(player: ClientData) {
        let overs: boolean[] = [];
        this.getRound(player.code).memberList.forEach(e => overs.push(e.field.gameNotOver));
        if (overs.every(e => e)) {
            let smn: ServerMessagePlayerWon = {
                type: "playerWon",
                player: this.nameIDDatafy(player)
            }
            player.socket.send(JSON.stringify(smn))
            this.sendToMembers(smn, player)
        }
    }

    generateCode(): number {
        let clientCode: number = Math.floor(1000 + Math.random() * 9000);
        if (this.rounds.some(e => e.code == clientCode)) {
            return this.generateCode();
        }
        return clientCode;
    }

    /**
     * Entfernt den Spieler aus dem "System" (Maps, Spiele, ...) sobald sich sein Websocket schließt
     * @param clientSocket Websocket des verlassenen Spielers
     */
    onWebSocketClientClosed(clientSocket: ws) {
        let clientData: ClientData = this.socketToClientDataMap.get(clientSocket);
        let round = this.getRound(clientData.code)
        // let clientData3Code: number = clientData3.code;
        let goneMessage: ServerMessage;
        let shg: ServerMessageGone = {
            type: "hostGone",
            player: this.nameIDDatafy(clientData),
        }
        let spg: ServerMessageGone = {
            type: "playerGone",
            player: this.nameIDDatafy(clientData),
        }
        if (clientData.host) {
            let index: number = this.rounds.indexOf(round, 0);
            if (index > -1) {
                this.rounds.splice(index, 1);
            }
            goneMessage = shg;
        } else {
            goneMessage = spg;
        }

        this.sendToMembers(goneMessage, clientData);

        this.socketToClientDataMap.delete(clientSocket);
        let newMemberList2: ClientData[] = this.getRound(clientData.code).memberList
        newMemberList2.splice(newMemberList2.indexOf(clientData), 1);
        this.getRound(clientData.code).memberList = newMemberList2
    }
}

new MainServer();