class BubbleIndexError(Exception):
    pass


class DataFetchError(BubbleIndexError):
    pass


class InsufficientDataError(BubbleIndexError):
    pass


class ScoringError(BubbleIndexError):
    pass
