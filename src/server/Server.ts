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

//Basiert auf: https://www.youtube.com/watch?v=acTb3UIKdRQ

export type ClientData = {
    //ClientData: Ein type mit allen Informationen die der Server von einem Spieler gerne wissen möchte
    socket: ws,
    id: number,
    name: string,
    host: boolean,
    code: number,
    field?: ServerField
}

export type NameIDData = {
    /*
    NameIDData: Ein type mit allen Informationen die ein Client über (Mit-)Spieler gerne wissen möchte,
    um diese Informationen über messages an einen Client zu geben
    */
    id: number,
    name: string
}

type round = {
    //round: Ein type mit den wichtigen Informationen jeder Spielrunde
    code: number,
    memberList: ClientData[],
    inMatch: boolean
}
export class MainServer {

    expressApp: express.Express = express();
    wsServer: ws.Server;

    clients: ClientData[] = [];
    rounds: round[] = [];
    socketToClientDataMap: Map<ws, ClientData> = new Map();
    //Basiert teils auf: https://www.youtube.com/watch?v=acTb3UIKdRQ
    /*
        Richtet den Express-Server und die Websocket Verbindung ein
     */
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

        // hier werden die Websocket Eventhandler eingesetzt
        that.wsServer.on('connection', (socketClient: ws) => {

            socketClient.on('message', (message: ws.Data) => {
                that.onMessage(socketClient, message);
            })

            socketClient.on('close', () => {
                that.onWebSocketClientClosed(socketClient);
            })
        })
    }

    /**
     * Macht eine ClientData zu einer NameIDData
     * @param clientData die ClientData
     * @returns die neue NameIDData
     */
    nameIDDatafy(clientData: ClientData): NameIDData {
        return {
            id: clientData.id,
            name: clientData.name
        }
    }


    /**
     * Sendet eine Message den Mitspielern eines Clients
     * @param message die Nachricht
     * @param clientData der Client
     */
    sendToMembers(message: ServerMessage, clientData: ClientData) {
        let round = this.rounds.find(e => { return e.code == clientData.code });
        if (round != undefined) {
            for (let client of round.memberList) {
                if (client.socket != clientData.socket) {
                    client.socket.send(JSON.stringify(message));
                }
            }
        }
    }

    /**
     * Beantwortung aller Nachrichten von Clients an den Server
     * @param messagerSocket Websocket des Absenders der Message
     * @param messageJson die Nachricht 
     */
    onMessage(messagerSocket: ws, messageJson: ws.Data) {

        let message: ClientMessage = JSON.parse(<string>messageJson);
        let messager: ClientData = this.socketToClientDataMap.get(messagerSocket);

        switch (message.id) {
            case "newClient":
                //Erstellt dem neuen Client eine ClientData, und setz in richtig ins System ein. Code generieren, einsetzen in die Maps, usw.
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
                //Mitteilung des Codes seiner Runde
                let sca: ServerMessageCodeAssignment = {
                    id: "codeAssignment",
                    ownData: this.nameIDDatafy(newClientData),
                    code: newClientCode
                }

                messagerSocket.send(JSON.stringify(sca))

                break;
            case "joinFriend":
                let newCode: number = +message.newCode;
                let joiningRound: round = this.rounds.find(e => { return e.code == newCode });

                //Überprüfung ob der Code überhaupt einer Runde gehört
                if (!this.rounds.some(e => e.code == newCode)) {
                    let sce: ServerMessageNotification = {
                        id: "codeError"
                    }
                    messagerSocket.send(JSON.stringify(sce));
                    //Überprüfung ob das Spiel bereits losgeht
                } else if (joiningRound.inMatch) {
                    let sce: ServerMessageNotification = {
                        id: "gameRunning"
                    }
                    messagerSocket.send(JSON.stringify(sce));
                } else {
                    let newMemberList: ClientData[] = joiningRound.memberList;
                    //Überprüfung, ob die Runde bereits voll ist
                    if (newMemberList.length < 5) {
                        messager.host = false;

                        //Mitteilung aller relevanten Clients, dass nun der Runde beigetreten wird.
                        let sfj: ServerMessageFriendJoins = {
                            id: "friendJoins",
                            player: this.nameIDDatafy(messager)
                        };


                        let sjf: ServerMessageJoiningFriend = {
                            id: "joiningFriend",
                            newPlayers: newMemberList,
                            code: newCode
                        };

                        messagerSocket.send(JSON.stringify(sjf));
                        messager.code = newCode;
                        newMemberList.push(messager);
                        joiningRound.memberList = newMemberList
                        this.sendToMembers(sfj, messager);

                    } else {
                        let ssf: ServerMessageNotification = {
                            id: "serverFull"
                        }
                        messagerSocket.send(JSON.stringify(ssf));
                    }
                }
                break;

            case "startGame":
                //Startet das Tetris-Spiel für alle Mitglieder der Runde
                let startedCode: number = messager.code
                let startedRound: round = this.rounds.find(e => { return e.code == startedCode })
                startedRound.inMatch = true;
                let memberList: ClientData[] = startedRound.memberList;

                memberList.forEach(e => e.field = new ServerField(e, this));
                let shs: ServerMessageNotification = {
                    id: "hostStartsTheGame",
                };
                this.sendToMembers(shs, messager);
                break;
            case "keyPressed":
                //Übergibt dem ServerField des Spielers jeden Tastendruck
                let field = messager.field;
                let brick;
                if (field != null) {
                    brick = field.brick;
                }
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
                        case "F":
                            field.brick.moveDownToBottom();
                            break;
                    }
                }
                break;
            case "lineDrag":
                messager.field.solvedLineHasBeenMoved(message.y);
                break;
            case "sendLine":
                let id = message.player.id;
                this.clients.find(e => e.id == id).field.lineSent();
                break;
            case "everythingRendered":
                let field1 = messager.field;
                if (field1 != null) {
                    field1.sendUpdateCounterMessage(field1.lineCounter);
                    field1.sendUpdateNextBricksMessage(field1.nextBricksArray);
                    if (field1.brick != null) {
                        field1.brick.updateShadowBrick();
                    }
                }
                break;
        }
    }

    /**
     * Überprüft, ob der Spieler seine Runde gewonnen hat
     * @param player der Spieler
     */
    checkIfWon(player: ClientData) {
        /*
        Überprüfung des GameOver-Statuses jedes Spielers der Runde,
        und falls alle bereits verloren haben sollten, ist der player der letzte "Verlierer" und gewinnt somit
        */
        let overs: boolean[] = [];
        let round = this.rounds.find(e => { return e.code == player.code })
        round.memberList.forEach(e => overs.push(e.field.gameNotOver));
        if (overs.every(e => !e)) {
            //Benachrichtigung jedes Mitspielers über den Sieg
            let smn: ServerMessagePlayerWon = {
                id: "playerWon",
                player: this.nameIDDatafy(player)
            }
            player.socket.send(JSON.stringify(smn))
            this.sendToMembers(smn, player);
            round.inMatch = false;
            round.memberList.forEach(e => e.field = null);
        }
    }

    /**
     * Generiert einen zufälligen einzigartigen 4-stelligen Zahlencode
     * @returns der Code
     */
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
        let round = this.rounds.find(e => { return e.code == clientData.code })
        let goneMessage: ServerMessage;

        let shg: ServerMessageGone = {
            id: "hostGone",
            player: this.nameIDDatafy(clientData),
        }
        let spg: ServerMessageGone = {
            id: "playerGone",
            player: this.nameIDDatafy(clientData),
        }
        if (clientData.host) {
            goneMessage = shg;
        } else {
            goneMessage = spg;
        }
        this.sendToMembers(goneMessage, clientData);
        this.socketToClientDataMap.delete(clientSocket);
        round.memberList.splice(round.memberList.indexOf(clientData), 1);
    }
}

new MainServer();