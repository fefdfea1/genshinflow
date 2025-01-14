import { styled } from "@/../styled-system/jsx";
import SubTitle from "@/features/loginSignUp/components/pageSubTitle/SubTitle";
import Input from "@/features/loginSignUp/components/Input/Input";
import Button from "@/features/loginSignUp/mobile/components/button/Button";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { loginReturnType, postLoginAuth } from "@/fetch/signIn/signIn";
// import { loginCount } from "@/features/loginSignUp/components/signIn/SignInAuth";
import loginState from "@/stores/loginStateStore";
import { checkMail } from "@/features/loginSignUp/auth/emailCheck/emailValidation";
import { passwordValidation } from "@/features/loginSignUp/auth/passwordCheck/passwordValidation";
import { useRouter } from "next/navigation";
import { CustomError } from "@/features/loginSignUp/components/signIn/SignInAuth";

export default function SignIn() {
	const { setModalState } = loginState();
	const [loginButtonState, setLoginButtonState] = useState<"login" | "lock">(
		"login",
	);
	const router = useRouter();
	const handler = (event: FormEvent<HTMLFormElement>) =>
		submitHandler(event, setModalState, setLoginButtonState);
	return (
		<LoginContainer className="loginContainer">
			<SubTitle platform="mobile">로그인</SubTitle>
			<form action="" onSubmit={handler}>
				<Input
					type={"email"}
					placeholder={"메일주소"}
					margin={"mb20"}
					platform="mobile"
				/>
				<Input
					type={"password"}
					placeholder={"비밀번호"}
					margin={"mb40"}
					platform="mobile"
				/>
				<Button
					buttonState={loginButtonState}
					setSignInButton={setLoginButtonState}
				>
					로그인
				</Button>
			</form>
		</LoginContainer>
	);
}

const LoginContainer = styled("article", {
	base: {
		position: "absolute",
		transform: "translate(200%)",
		transition: "transform 0.5s",
		top: "308px",
		left: "0",
		padding: "0 20px",
	},
});

async function submitHandler(
	event: FormEvent,
	setModal: (state: string) => void,
	buttonState: Dispatch<SetStateAction<"login" | "lock">>,
) {
	event.preventDefault();
	const target = event.target as HTMLElement;
	const $emailDom = target.childNodes[0] as HTMLInputElement;
	const $passwordDom = target.childNodes[1] as HTMLInputElement;
	const emailValue = $emailDom.value;
	const passwordValue = $passwordDom.value;
	try {
		if (emailValue === "") {
			setModal("이메일을 입력해주세요");
			return;
		} else if (passwordValue === "") {
			setModal("비밀번호를 입력해주세요");
			return;
		} else if (!checkMail(emailValue) || !passwordValidation(passwordValue)) {
			setModal("이메일 혹은 비밀번호의 형식이 올바르지 않습니다");
			return;
		} else {
			const response = (await postLoginAuth(
				emailValue,
				passwordValue,
			)) as loginReturnType;
			if (response.message === "로그인 실패") {
				throw new CustomError("로그인 실패", {
					failLoginCount: response.failLoginCount,
					message: response.message,
				});
			}
		}
	} catch (error) {
		if (error instanceof CustomError) {
			switch (Number(error.customData.failLoginCount)) {
				case 5:
					buttonState("lock");
					setModal("5회 연속 오류로 30초 뒤 시도해주세요");
					break;
				case 10:
					setModal(
						"10회 연속 오류로 계정이 보호 처리됩니다. 비밀번호를 변경해주세요",
					);
					break;
				default:
					setModal(
						"메일주소 및 비밀번호가 틀렸습니다. 5회 틀릴 시 제한이 생깁니다",
					);
			}
		}
	}
}
