export function ResultOptionList() {
    return (
        <ul>
            <li className="result-option-item">
                <input type="checkbox" checked></input>
                <span>원곡</span>
            </li>
            <li className="result-option-item">
                <input type="checkbox" checked></input>
                <span>MR</span>
            </li>
            <li className="result-option-item">
                <input type="checkbox" checked></input>
                <span>보컬 멜로디 반주</span>
            </li>
            <li className="result-option-item">
                <input type="checkbox" checked disabled></input>
                <span>노래방 영상</span>
            </li>
            <li className="result-option-item">
                <input type="checkbox" checked></input>
                <span>따라부르기 영상</span>
            </li>
            <li className="result-option-item">
                <input type="checkbox" checked></input>
                <span>보컬 멜로디 노래방 영상</span>
            </li>
            <li className="result-option-item">
                <input type="checkbox" checked></input>
                <span>싱크 데이터</span>
            </li>
        </ul>
    )
}