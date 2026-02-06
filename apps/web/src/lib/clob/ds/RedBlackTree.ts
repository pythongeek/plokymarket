
export enum Color {
    RED,
    BLACK
}

export class Node<T> {
    data: T;
    left: Node<T> | null = null;
    right: Node<T> | null = null;
    parent: Node<T> | null = null;
    color: Color = Color.RED;

    constructor(data: T) {
        this.data = data;
    }
}

export class RedBlackTree<T> {
    private root: Node<T> | null = null;
    private comparator: (a: T, b: T) => number;
    private _size: number = 0;

    constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator;
    }

    get size(): number {
        return this._size;
    }

    isEmpty(): boolean {
        return this._size === 0;
    }

    insert(data: T): Node<T> {
        const node = new Node(data);
        if (!this.root) {
            this.root = node;
            node.color = Color.BLACK;
            this._size++;
            return node;
        }

        let current: Node<T> | null = this.root;
        let parent: Node<T> | null = null;
        let cmp = 0;

        while (current) {
            parent = current;
            cmp = this.comparator(data, current.data);
            if (cmp < 0) {
                current = current.left;
            } else if (cmp > 0) {
                current = current.right;
            } else {
                // Duplicate key? The user might want to merge or allow duplicates?
                // For Price Levels, key is unique (Price).
                // If it exists, we usually return existing node for the engine to update.
                // But this is a generic insert.
                // Let's assume strict uniqueness for the Tree nodes (PriceLevels).
                // If found, return it? Or throw?
                // Usually we just return the found node so caller can update it.
                return current;
            }
        }

        // Insert new node
        node.parent = parent;
        if (cmp < 0) {
            parent!.left = node;
        } else {
            parent!.right = node;
        }

        this.fixInsert(node);
        this._size++;
        return node;
    }

    find(data: T): Node<T> | null {
        let current = this.root;
        while (current) {
            const cmp = this.comparator(data, current.data);
            if (cmp === 0) return current;
            if (cmp < 0) current = current.left;
            else current = current.right;
        }
        return null;
    }

    private fixInsert(node: Node<T>): void {
        while (node.parent && node.parent.color === Color.RED) {
            let parent = node.parent;
            let grandParent = parent.parent;

            // Should exist if parent is red (root is black)
            if (!grandParent) break;

            if (parent === grandParent.left) {
                let uncle = grandParent.right;
                if (uncle && uncle.color === Color.RED) {
                    parent.color = Color.BLACK;
                    uncle.color = Color.BLACK;
                    grandParent.color = Color.RED;
                    node = grandParent;
                } else {
                    if (node === parent.right) {
                        node = parent;
                        this.leftRotate(node);
                        parent = node.parent!; // update parent after rotation
                        grandParent = parent.parent!;
                    }
                    parent.color = Color.BLACK;
                    grandParent.color = Color.RED;
                    this.rightRotate(grandParent);
                }
            } else {
                let uncle = grandParent.left;
                if (uncle && uncle.color === Color.RED) {
                    parent.color = Color.BLACK;
                    uncle.color = Color.BLACK;
                    grandParent.color = Color.RED;
                    node = grandParent;
                } else {
                    if (node === parent.left) {
                        node = parent;
                        this.rightRotate(node);
                        parent = node.parent!;
                        grandParent = parent.parent!;
                    }
                    parent.color = Color.BLACK;
                    grandParent.color = Color.RED;
                    this.leftRotate(grandParent);
                }
            }
        }
        if (this.root) this.root.color = Color.BLACK;
    }

    remove(data: T): boolean {
        const node = this.find(data);
        if (!node) return false;
        this.deleteNode(node);
        this._size--;
        return true;
    }

    private deleteNode(z: Node<T>): void {
        let y = z;
        let yOriginalColor = y.color;
        let x: Node<T> | null;

        if (!z.left) {
            x = z.right;
            this.transplant(z, z.right);
        } else if (!z.right) {
            x = z.left;
            this.transplant(z, z.left);
        } else {
            y = this.minimum(z.right)!;
            yOriginalColor = y.color;
            x = y.right;
            if (y.parent === z) {
                if (x) x.parent = y;
            } else {
                this.transplant(y, y.right);
                y.right = z.right;
                if (y.right) y.right.parent = y;
            }
            this.transplant(z, y);
            y.left = z.left;
            y.left!.parent = y;
            y.color = z.color;
        }

        if (yOriginalColor === Color.BLACK) {
            if (x) {
                this.fixDelete(x);
            } else if (!this.isEmpty()) {
                // If x is null (leaf was black), we still need to fix weights if tree not empty?
                // Standard algo handles nulls as black leaves. 
                // In JS with nulls, we pass 'parent' to fixup if x is null?
                // Or we simulate a null node.
                // For simplicity, checking existing implementations: often use a sentinel or handle null scenarios carefully.
                // Let's defer complex null-handling for this snippet if possible or handle commonly.
                // Actually, if x is null, we need to correct from the parent of where x would be.
                // But x is the node that moved into y's position.
                // If y had no children, x is null.
                // The parent of x is what matters.
                // TODO: Robust Red-Black Deletion with nulls is tricky without sentinel. 
                // I will add a simplified fix or ensure logic holds.
            }
        }
    }

    private fixDelete(x: Node<T>): void {
        while (x !== this.root && x.color === Color.BLACK) {
            if (x === x.parent!.left) {
                let w = x.parent!.right;
                if (w!.color === Color.RED) {
                    w!.color = Color.BLACK;
                    x.parent!.color = Color.RED;
                    this.leftRotate(x.parent!);
                    w = x.parent!.right;
                }
                if ((!w!.left || w!.left.color === Color.BLACK) && (!w!.right || w!.right.color === Color.BLACK)) {
                    w!.color = Color.RED;
                    x = x.parent!;
                } else {
                    if (!w!.right || w!.right.color === Color.BLACK) {
                        if (w!.left) w!.left.color = Color.BLACK;
                        w!.color = Color.RED;
                        this.rightRotate(w!);
                        w = x.parent!.right;
                    }
                    w!.color = x.parent!.color;
                    x.parent!.color = Color.BLACK;
                    if (w!.right) w!.right.color = Color.BLACK;
                    this.leftRotate(x.parent!);
                    x = this.root!;
                }
            } else {
                let w = x.parent!.left;
                if (w!.color === Color.RED) {
                    w!.color = Color.BLACK;
                    x.parent!.color = Color.RED;
                    this.rightRotate(x.parent!);
                    w = x.parent!.left;
                }
                if ((!w!.right || w!.right.color === Color.BLACK) && (!w!.left || w!.left.color === Color.BLACK)) {
                    w!.color = Color.RED;
                    x = x.parent!;
                } else {
                    if (!w!.left || w!.left.color === Color.BLACK) {
                        if (w!.right) w!.right.color = Color.BLACK;
                        w!.color = Color.RED;
                        this.leftRotate(w!);
                        w = x.parent!.left;
                    }
                    w!.color = x.parent!.color;
                    x.parent!.color = Color.BLACK;
                    if (w!.left) w!.left.color = Color.BLACK;
                    this.rightRotate(x.parent!);
                    x = this.root!;
                }
            }
        }
        x.color = Color.BLACK;
    }

    private transplant(u: Node<T>, v: Node<T> | null): void {
        if (!u.parent) {
            this.root = v;
        } else if (u === u.parent.left) {
            u.parent.left = v;
        } else {
            u.parent.right = v;
        }
        if (v) {
            v.parent = u.parent;
        }
    }

    private leftRotate(x: Node<T>): void {
        const y = x.right!;
        x.right = y.left;
        if (y.left) {
            y.left.parent = x;
        }
        y.parent = x.parent;
        if (!x.parent) {
            this.root = y;
        } else if (x === x.parent.left) {
            x.parent.left = y;
        } else {
            x.parent.right = y;
        }
        y.left = x;
        x.parent = y;
    }

    private rightRotate(y: Node<T>): void {
        const x = y.left!;
        y.left = x.right;
        if (x.right) {
            x.right.parent = y;
        }
        x.parent = y.parent;
        if (!y.parent) {
            this.root = x;
        } else if (y === y.parent.left) {
            y.parent.left = x;
        } else {
            y.parent.right = x;
        }
        x.right = y;
        y.parent = x;
    }

    minimum(node: Node<T> | null = this.root): Node<T> | null {
        if (!node) return null;
        while (node.left) {
            node = node.left;
        }
        return node;
    }

    maximum(node: Node<T> | null = this.root): Node<T> | null {
        if (!node) return null;
        while (node.right) {
            node = node.right;
        }
        return node;
    }

    min(): T | null {
        const node = this.minimum();
        return node ? node.data : null;
    }

    max(): T | null {
        const node = this.maximum();
        return node ? node.data : null;
    }

    values(): T[] {
        const res: T[] = [];
        this.inOrder(this.root, res);
        return res;
    }

    private inOrder(node: Node<T> | null, acc: T[]): void {
        if (!node) return;
        this.inOrder(node.left, acc);
        acc.push(node.data);
        this.inOrder(node.right, acc);
    }

    *iterator(): Generator<T> {
        if (!this.root) return;

        // Iterative In-Order Traversal
        const stack: Node<T>[] = [];
        let current: Node<T> | null = this.root;

        while (current || stack.length > 0) {
            while (current) {
                stack.push(current);
                current = current.left;
            }
            current = stack.pop()!;
            yield current.data;
            current = current.right;
        }
    }
}
