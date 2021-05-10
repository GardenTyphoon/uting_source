import axios from 'axios';
import React from 'react';
import { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import socketio from 'socket.io-client';
import { useAppState } from '../../providers/AppStateProvider';
import { useMeetingManager } from 'amazon-chime-sdk-component-library-react';
import { createGetAttendeeCallback, fetchMeeting } from '../../utils/api';

function birthToAge(birth) {

    let year = birth.slice(0, 4);
    return 2021 - Number(year) + 1;
}
function limitNumOfParticipants (inputTag, inputValue, numOfGroupMember){
    
    if(inputTag==='num' && inputValue>=numOfGroupMember && inputValue<=4) return true;
    else return false;
}
function contidionMakingRoom (toggleShowWarningMess, roomTitle, roomNum){
    
    if(toggleShowWarningMess===false && roomTitle!="" && roomNum>0) return true;
    else return false;
}


const Meeting = ({ checkFunc }) => {
    const history = useHistory();
    const meetingManager = useMeetingManager();
    const { setAppMeetingInfo, region: appRegion, meetingId: appMeetingId } = useAppState();
    const socket = socketio.connect('http://localhost:3001');
    
    const [groupMembers, setGroupMembers] = useState([]);
    const [toggleShowWarningMess, setToggleShowWarningMess] = useState(false);
    const [socketOn, setSocketOn] = useState(false);
    
    
    let sessionUser = sessionStorage.getItem("nickname");
    let groupMembersSocketId = [];
    let groupMembersInfo = [];

    
    const [room, setRoom] = useState({
        title: "", //방제
        num: 0, //성별당 최대인원
        status: '대기',  // 참가버튼 누르면 미팅중
        users: [],
    })

    const onChangehandler = e => {

        const { name, value } = e.target;
        if (name === 'title') {
            setRoom({
                ...room,
                [name]: value
            })
        }
        else {            
            if (limitNumOfParticipants(name, value, Object.keys(groupMembers.data).length)) {
                
                setRoom({
                    ...room,
                    [name]: value
                })
                setToggleShowWarningMess(false);
            }
            else {
                setToggleShowWarningMess(true);
            }
        }
    };
    const getMyGroupMember = async (e) => {
        let res = await axios.post('http://localhost:3001/groups/getMyGroupMember', { sessionUser: sessionUser });
        
        setGroupMembers(res);
    }
    useEffect(() => {
        getMyGroupMember();
    }, [])
    const makeRoom = async (e) => {
        e.preventDefault();
        if (contidionMakingRoom(toggleShowWarningMess, room.title, room.num)) {
            //내가 속한 그룹의 그룹원들 닉네임 받아오기
            //평균 나이, 평균 학점, 현재 남녀 수 구하기
            let avgManner = 0;
            let avgAge = 0;
            let nowOfWoman = 0;
            let nowOfMan = 0;
            for (let i = 0; i < (groupMembers.data).length; i++) {
                let userInfo = await axios.post('http://localhost:3001/users/userInfo', { "userId": groupMembers.data[i] });
                groupMembersInfo.push({
                    "nickname": userInfo.data.nickname,
                    "introduce": userInfo.data.introduce,
                    "mannerCredit": userInfo.data.mannerCredit,
                    "age": birthToAge(userInfo.data.birth)
                });
                if (userInfo.data.nickname != sessionUser) {
                    groupMembersSocketId.push(userInfo.data.socketid);
                }
                avgManner += userInfo.data.mannerCredit;
                avgAge += birthToAge(userInfo.data.birth);
                if (userInfo.data.gender === "woman") {
                    nowOfWoman += 1;
                }
                else nowOfMan += 1;


            }
            setSocketOn(groupMembersSocketId);
            avgManner /= (groupMembers.data).length;
            avgAge /= (groupMembers.data).length;
            avgAge = parseInt(avgAge);
            //방 생성
            const roomTitle = room.title.trim().toLocaleLowerCase()
            let data = {
                title: roomTitle,
                maxNum: Number(room.num),
                status: room.status,
                avgManner: avgManner.toFixed(3),
                avgAge: avgAge,
                numOfWoman: nowOfWoman,
                numOfMan: nowOfMan
            };
            data.users = groupMembersInfo;
            console.log(data);

            // await axios.post('http://localhost:3001/meetings', data);
            meetingManager.getAttendee = createGetAttendeeCallback(roomTitle);
            checkFunc(true)

            try {
                // 원래 형태는 id(title), 참여자이름, 지역임.
                // const { JoinInfo } = await fetchMeeting(roomTitle, room);
                const { JoinInfo } = await fetchMeeting(roomTitle, data);
                await meetingManager.join({
                    meetingInfo: JoinInfo.Meeting,
                    attendeeInfo: JoinInfo.Attendee
                });
                // 디바이스 세팅하고 미팅 시작하는데 영향 끼치는 부분이라서
                // 실제로는 중간 파라미터로 사용자 이름 넣어야함. sessionUser가 보니까 nickname string인거 같은데 그거 넣으면 될 듯 하다
                setAppMeetingInfo(roomTitle, "Tester", 'ap-northeast-2');
                history.push('/deviceSetup');
            } catch (error) {
                console.log(error);
            }
        }
    }
    useEffect(() => {
        socket.on('connect', function () {

            socket.emit('makeMeetingRoomMsg', { "groupMembersSocketId": socketOn })
        })
    }, [socketOn])
    return (
        <div>
            <input className="room-input" type='text' placeholder='방제목' onChange={onChangehandler} name='title' />
            <input type='number' min='1' max='4' placeholder='명수' onChange={onChangehandler} name='num'/>
            <button onClick={makeRoom}>방만들기</button>
            {toggleShowWarningMess === true ?
                <div style={{ marginTop: "10px", fontFamily: "NanumSquare_acR", color: "#FF6994", fontSize: "small" }}>*성별 당 인원수는 적어도 {(groupMembers.data).length}명 이상, 4명 이하여야 합니다.</div>
                : ""}
            
        </div>

    )
};
export default Meeting;

