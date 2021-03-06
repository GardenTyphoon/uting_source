import React, { useEffect, useState } from "react";

import { useHistory } from "react-router-dom";
import defaultAxios from "../../utils/defaultAxios";
import MyProfile from "./MyProfile";
import ProfileNoImage from "../../img/MeetingRoom.png";
import ucoin from "../../img/ucoin.png";
import {
  Button,
  CardBody,
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  Row,
} from "reactstrap";
import baseurl from "../../utils/baseurl";

const Profile = ({ modNickname }) => {
  const history = useHistory();
  const [imgBase64, setImgBase64] = useState("");
  const [ProfileInfo, setProfileInfo] = useState({
    nickname: "",
    imgURL: "",
    mannerCredit: "",
    ucoin: "",
  });
  const [toggleprofile, setToggleProfile] = useState(false);
  const toggleProfileBtn = (e) => {
    setToggleProfile(!toggleprofile);
  };
  const [checkProfile, setCheckProfile] = useState(false);

  let sessionUser = sessionStorage.getItem("email");

  const coinWindow = () => {
    const coinWin = window.open(
      //ret = 창 객체
      `${baseurl.baseFront}/ucoin`,
      "_blank",
      "resizable=no, left=0, top=0, width=820, height=1020"
    );
  };
  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    if (checkProfile === true) {
      getProfile();
    }
  }, [checkProfile]);

  let checkMyprofile = (e) => {
    setCheckProfile(e);
  };

  const getProfile = async (e) => {
    const res = await defaultAxios.post("/users/viewMyProfile", {
      sessionUser: sessionUser,
      type: "profile",
    });
    if (res.data.imgURL !== "") {
      let staticpath = `${baseurl.baseBack}`;
      setImgBase64(staticpath + res.data.imgURL);
    }
    let data = {
      nickname: res.data.nickname,
      imgURL: res.data.imgURL,
      ucoin: res.data.ucoin,
    };
    setProfileInfo(data);
    setCheckProfile(false);
  };

  return (
    <div
      style={{
        fontFamily: "NanumSquare_acR",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "180px",
        marginBottom: "20px",
      }}
    >
      <button
        onClick={(e) => {
          toggleProfileBtn(e);
        }}
        style={{
          borderRadius: "16px",
          padding: "0%",
          border: "2px solid #e2e2e2e2",
        }}
      >
        {imgBase64 === "" ? (
          <img
            src={ProfileNoImage}
            alt="profile img"
            height="60"
            width="60"
            style={{ borderRadius: "15px" }}
          />
        ) : (
          <img
            src={imgBase64}
            alt="profile img"
            height="60"
            width="60"
            style={{ borderRadius: "15px" }}
          />
        )}
      </button>
      <div style={{ display: "flex", flexDirection: "column", width: "100px" }}>
        <div
          style={{ marginLeft: "15%", color: "#896E6E", fontWeight: "bold" }}
        >
          {ProfileInfo.nickname}
        </div>
        <div
          style={{
            marginLeft: "8%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <img style={{ width: "30px", marginRight: "3%" }} src={ucoin}></img>
          <div style={{ color: "#896E6E", fontWeight: "bold" }}>
            {ProfileInfo.ucoin}
          </div>
          <button
            onClick={coinWindow}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "5px",
              fontSize: "small",
              marginLeft: "5px",
            }}
          >
            충전
          </button>
        </div>
      </div>
      <Modal isOpen={toggleprofile}>
        <ModalBody isOpen={toggleprofile} style={{ background: "#FFB4AC" }}>
          <Row>
            <button
              onClick={(e) => {
                toggleProfileBtn(e);
              }}
              style={{
                background: "transparent",
                border: "none",
                position: "absolute",
                left: "90%",
              }}
            >
              X
            </button>
          </Row>
          <Row>
            <MyProfile
              modNickname={(e) => modNickname(e)}
              choicename={sessionStorage.getItem("nickname")}
              checkProfilefunc={(e) => checkMyprofile(e)}
            />
          </Row>
        </ModalBody>
      </Modal>
    </div>
  );
};
export default Profile;
