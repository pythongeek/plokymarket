
import { Order } from '../types';

export class ListNode<T> {
    value: T;
    next: ListNode<T> | null = null;
    prev: ListNode<T> | null = null;

    constructor(value: T) {
        this.value = value;
    }
}

export class DoublyLinkedList<T> {
    head: ListNode<T> | null = null;
    tail: ListNode<T> | null = null;
    private _size: number = 0;

    constructor() { }

    get size(): number {
        return this._size;
    }

    push(val: T): ListNode<T> {
        const newNode = new ListNode(val);
        if (!this.head || !this.tail) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            this.tail.next = newNode;
            newNode.prev = this.tail;
            this.tail = newNode;
        }
        this._size++;
        return newNode;
    }

    remove(node: ListNode<T>): void {
        if (!node) return;

        if (node.prev) {
            node.prev.next = node.next;
        } else {
            // Head
            this.head = node.next;
        }

        if (node.next) {
            node.next.prev = node.prev;
        } else {
            // Tail
            this.tail = node.prev;
        }

        node.prev = null;
        node.next = null;
        this._size--;
    }

    shift(): T | undefined {
        if (!this.head) return undefined;
        const node = this.head;
        this.remove(node);
        return node.value;
    }

    isEmpty(): boolean {
        return this._size === 0;
    }

    *[Symbol.iterator](): Iterator<T> {
        let current = this.head;
        while (current) {
            yield current.value;
            current = current.next;
        }
    }
}
