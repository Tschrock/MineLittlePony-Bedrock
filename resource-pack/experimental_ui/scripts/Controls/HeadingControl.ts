import { TagContent, Control } from "./Control";

export interface HeadingControlOptions {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    content: TagContent;
}

export class HeadingControl extends Control<'div'> {
    constructor(private readonly options: HeadingControlOptions) {
        super('div');
        this.classes(`h${this.options.level}`).content(this.options.content)
    }
}
