import enum

class CheckInStatus(str, enum.Enum):
    OK = "OK"
    CONCERN = "CONCERN"
    EMERGENCY = "EMERGENCY"
    NO_ANSWER = "NO_ANSWER" 